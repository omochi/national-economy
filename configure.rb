#!/usr/bin/env ruby

require "pathname"
require "shellwords"
require "json"

$repo_top_dir = Pathname(__FILE__).parent.expand_path

def get_files_in_dir(dir)
    result = []
    if dir.file?
        path = dir
        if yield(path)
            result << path
        end
    elsif dir.directory? 
        Dir.chdir(dir.to_s)
        Pathname.glob("**/*") { |rel_path|
            path = dir + rel_path
            if ! path.file?
                next
            end
            if yield(path)
                result.push(path)
            end
        }
    end
    return result
end
def get_files_in_dir_with_ext(dir, ext)
    get_files_in_dir(dir) { |p| p.extname == ext }
end
def get_ts_files_in_dir(dir)
    get_files_in_dir_with_ext(dir, ".ts")
end
def get_ts_files_in_dirs(dirs)
    dirs.map { |d| get_ts_files_in_dir(d) }.flatten(1)
end

class Target
    def initialize(name)
        @name = name
        @type_decl_dirs = []
        @dependencies = []
        @compiler_options = {
            :module => "commonjs",
            target: "es5",
            declaration: true,
            noImplicitAny: true,
            noEmitOnError: true,
            sourceMap: false
        }
    end
    attr_reader :name
    attr_accessor :source_dir
    attr_accessor :output_dir
    attr_accessor :target_dir
    attr_accessor :type_decl_dirs
    attr_accessor :dependencies
    attr_accessor :compiler_options

    def source_output_decls
        get_ts_files_in_dir(source_dir).map { |path|
            rel_path = path.relative_path_from(source_dir)

            source_filename_str = path.basename.to_s
            out_decl_filename_str = source_filename_str.gsub(/\.\w+$/, ".d.ts")

            output_dir + rel_path.parent + out_decl_filename_str
        }
    end

    def each_dependencies
        Enumerator.new { |y|
            for dep in dependencies
                y << dep
                for dep2 in dep.each_dependencies
                    y << dep2
                end
            end
        }
    end

    def generate_tsconfig
        sources = []
        for dep in each_dependencies
            sources += get_ts_files_in_dirs(dep.type_decl_dirs)
            sources += dep.source_output_decls
        end
        
        sources += get_ts_files_in_dirs(type_decl_dirs)
        sources += get_ts_files_in_dir(source_dir)

        compiler_options = self.compiler_options.clone
        compiler_options.tap { |o| 
            o[:rootDir] = source_dir.relative_path_from(target_dir).to_s
            o[:outDir] = output_dir.relative_path_from(target_dir).to_s
        }

        json = {
            compilerOptions: compiler_options,
            files: sources.map { |p| p.relative_path_from(target_dir).to_s }
        }
        json_str = JSON.pretty_generate(json)

        (target_dir + "tsconfig.json").binwrite(json_str)
    end

end

class App
    def target_top_dir(target_name)
        $repo_top_dir + "target/#{target_name}"
    end
    def main
        top_dir = $repo_top_dir

        common_target = Target.new("common")
        common_target.tap { |t|
            t.source_dir = top_dir + "src/#{t.name}"
            t.output_dir = top_dir + "out/#{t.name}"
            t.target_dir = top_dir + "target/#{t.name}"
            t.type_decl_dirs += [
                top_dir + "typings/main/definitions/lodash/index.d.ts",
                top_dir + "node_modules/rx/ts/rx.all.d.ts",
                top_dir + "type_decl/common"
            ]
        }

        server_target = Target.new("server")
        server_target.tap { |t|
            t.source_dir = top_dir + "src/#{t.name}"
            t.output_dir = top_dir + "out/#{t.name}"
            t.target_dir = top_dir + "target/#{t.name}"
            t.type_decl_dirs += [
                top_dir + "typings/main/ambient/node",
                top_dir + "typings/main/ambient/websocket",
                top_dir + "type_decl/server"
            ]
            t.dependencies.push(common_target)
        }

        browser_target = Target.new("browser")
        browser_target.tap { |t|
            t.source_dir = top_dir + "src/#{t.name}"
            t.output_dir = top_dir + "out/#{t.name}"
            t.target_dir = top_dir + "target/#{t.name}"
            t.type_decl_dirs += [
            ]
            t.dependencies.push(common_target)
        }


        for t in [common_target, server_target, browser_target]
            t.generate_tsconfig
        end

    end
end

app = App.new
app.main()